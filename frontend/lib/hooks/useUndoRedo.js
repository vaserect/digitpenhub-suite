import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for undo/redo functionality
 * Manages history stack for any state changes
 */
export function useUndoRedo(initialState, maxHistorySize = 50) {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const updateState = useCallback((newState) => {
    // Don't add to history if this is an undo/redo action
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      setState(newState);
      return;
    }

    setState(newState);

    // Add to history
    setHistory(prev => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setCurrentIndex(prev => prev - 1);
      }
      
      return newHistory;
    });

    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      return newIndex >= maxHistorySize ? maxHistorySize - 1 : newIndex;
    });
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (!canUndo) return;

    isUndoRedoAction.current = true;
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    setState(history[newIndex]);
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    isUndoRedoAction.current = true;
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    setState(history[newIndex]);
  }, [canRedo, currentIndex, history]);

  const reset = useCallback((newInitialState) => {
    setState(newInitialState);
    setHistory([newInitialState]);
    setCurrentIndex(0);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([state]);
    setCurrentIndex(0);
  }, [state]);

  return {
    state,
    setState: updateState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    clearHistory,
    historySize: history.length,
    currentIndex
  };
}
