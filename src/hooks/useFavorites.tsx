// Hook for managing document favorites (stored in localStorage)
import { useState, useEffect, useCallback } from 'react';

export interface FavoriteDocument {
  id: string;
  type: 'loi' | 'decret' | 'jurisprudence';
  numero: string;
  title: string;
  date: string;
  addedAt: number;
}

const STORAGE_KEY = 'snij_favorites';

function loadFavorites(): FavoriteDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: FavoriteDocument[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Failed to save favorites:', e);
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteDocument[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites on mount
  useEffect(() => {
    setFavorites(loadFavorites());
    setIsLoaded(true);
  }, []);

  // Check if a document is favorited
  const isFavorite = useCallback(
    (documentId: string): boolean => {
      return favorites.some((f) => f.id === documentId);
    },
    [favorites]
  );

  // Add a document to favorites
  const addFavorite = useCallback(
    (doc: Omit<FavoriteDocument, 'addedAt'>): void => {
      setFavorites((prev) => {
        // Don't add if already exists
        if (prev.some((f) => f.id === doc.id)) return prev;

        const newFavorites = [
          ...prev,
          {
            ...doc,
            addedAt: Date.now(),
          },
        ];
        saveFavorites(newFavorites);
        return newFavorites;
      });
    },
    []
  );

  // Remove a document from favorites
  const removeFavorite = useCallback((documentId: string): void => {
    setFavorites((prev) => {
      const newFavorites = prev.filter((f) => f.id !== documentId);
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  // Toggle favorite status
  const toggleFavorite = useCallback(
    (doc: Omit<FavoriteDocument, 'addedAt'>): boolean => {
      const isCurrentlyFavorite = isFavorite(doc.id);
      if (isCurrentlyFavorite) {
        removeFavorite(doc.id);
        return false;
      } else {
        addFavorite(doc);
        return true;
      }
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  // Clear all favorites
  const clearFavorites = useCallback((): void => {
    setFavorites([]);
    saveFavorites([]);
  }, []);

  // Get favorites sorted by date added (most recent first)
  const sortedFavorites = [...favorites].sort((a, b) => b.addedAt - a.addedAt);

  // Get favorites count
  const count = favorites.length;

  return {
    favorites: sortedFavorites,
    count,
    isLoaded,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    clearFavorites,
  };
}

// Context for global favorites state (optional, for header badge etc.)
import { createContext, useContext, ReactNode } from 'react';

interface FavoritesContextType {
  favorites: FavoriteDocument[];
  count: number;
  isLoaded: boolean;
  isFavorite: (documentId: string) => boolean;
  addFavorite: (doc: Omit<FavoriteDocument, 'addedAt'>) => void;
  removeFavorite: (documentId: string) => void;
  toggleFavorite: (doc: Omit<FavoriteDocument, 'addedAt'>) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const favoritesState = useFavorites();

  return (
    <FavoritesContext.Provider value={favoritesState}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
}
