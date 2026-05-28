'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { PLANTS, getUserPlants } from '../lib/plants/config';
import type { PlantConfig } from '../lib/plants/config';
import type { User } from '../types/index';
import { getRepository } from '../lib/repository';

const STORAGE_KEY = 'hsls:activePlantId';

interface PlantContextValue {
  /** Short code of the currently active plant (e.g. "NMQM"). */
  activePlantId: string;
  /** Full config object for the active plant. */
  activePlant: PlantConfig;
  /** All plants this user can access, in display order. */
  availablePlants: PlantConfig[];
  /** Switch to a different plant. No-op if the plant is not in availablePlants. */
  setActivePlant: (plantId: string) => void;
  /** The current user. Null while the session is loading. */
  user: User | null;
  /** Return the user's role string at a given plant ("Manager" | "User" | "Admin"). */
  roleAtPlant: (plantId: string) => string;
}

const PlantContext = createContext<PlantContextValue | null>(null);

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Initialise activePlantId from localStorage before the user loads so the
  // correct plant is already selected on first render.
  const [activePlantId, setActivePlantId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'NMQM';
    return localStorage.getItem(STORAGE_KEY) ?? 'NMQM';
  });

  // Load the user from the repository once on mount.
  useEffect(() => {
    getRepository('user')
      .getCurrentUser()
      .then((u: User) => {
        setUser(u);
        // Re-validate the stored plant against the user's actual access list.
        const accessible = new Set(u.plants.map(p => p.plantId));
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && accessible.has(stored)) {
          setActivePlantId(stored);
        } else {
          setActivePlantId(u.defaultPlantId ?? getUserPlants(u)[0]?.id ?? 'NMQM');
        }
      });
  }, []);

  // Persist the active plant whenever it changes.
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activePlantId);
  }, [activePlantId]);

  const availablePlants = user ? getUserPlants(user) : [];
  const activePlant = PLANTS[activePlantId] ?? availablePlants[0] ?? Object.values(PLANTS)[0];

  function setActivePlant(plantId: string) {
    if (!user) return;
    const accessible = new Set(user.plants.map(p => p.plantId));
    if (accessible.has(plantId)) setActivePlantId(plantId);
  }

  function roleAtPlant(plantId: string): string {
    return user?.plants.find(p => p.plantId === plantId)?.role ?? 'User';
  }

  return (
    <PlantContext.Provider value={{
      activePlantId,
      activePlant,
      availablePlants,
      setActivePlant,
      user,
      roleAtPlant,
    }}>
      {children}
    </PlantContext.Provider>
  );
}

export function usePlant(): PlantContextValue {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error('usePlant must be used within PlantProvider');
  return ctx;
}
