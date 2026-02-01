/**
 * UI Store - Estado de la interfaz de usuario
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type ModalType = 
  | 'settings'
  | 'inventory'
  | 'character'
  | 'shop'
  | 'confirm'
  | 'pause'
  | null;

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'rpg';
  title: string;
  message?: string;
  duration?: number;
  icon?: string;
}

export interface UIState {
  // Loading
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress: number;
  
  // Modales
  activeModal: ModalType;
  modalData: Record<string, unknown> | null;
  
  // Toasts/Notificaciones
  toasts: Toast[];
  
  // Sidebar/Navigation
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  
  // HUD in-game
  showHUD: boolean;
  showMinimap: boolean;
  showChat: boolean;
  
  // Transiciones
  isTransitioning: boolean;
}

export interface UIActions {
  // Loading
  setLoading: (isLoading: boolean, message?: string) => void;
  setLoadingProgress: (progress: number) => void;
  
  // Modales
  openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  // Toasts
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Navigation
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  
  // HUD
  toggleHUD: () => void;
  toggleMinimap: () => void;
  toggleChat: () => void;
  setShowHUD: (show: boolean) => void;
  
  // Transiciones
  setTransitioning: (isTransitioning: boolean) => void;
}

const initialState: UIState = {
  isLoading: false,
  loadingMessage: '',
  loadingProgress: 0,
  
  activeModal: null,
  modalData: null,
  
  toasts: [],
  
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  
  showHUD: true,
  showMinimap: true,
  showChat: false,
  
  isTransitioning: false,
};

export const useUIStore = create<UIState & UIActions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      
      // Loading
      setLoading: (isLoading, message = '') => set({
        isLoading,
        loadingMessage: message,
        loadingProgress: isLoading ? 0 : 100,
      }),
      
      setLoadingProgress: (loadingProgress) => set({ loadingProgress }),
      
      // Modales
      openModal: (modal, data = undefined) => set({
        activeModal: modal,
        modalData: data,
      }),
      
      closeModal: () => set({
        activeModal: null,
        modalData: null,
      }),
      
      // Toasts
      addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { ...toast, id };
        
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));
        
        // Auto-remove después de la duración
        const duration = toast.duration ?? 5000;
        if (duration > 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, duration);
        }
      },
      
      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      })),
      
      clearToasts: () => set({ toasts: [] }),
      
      // Navigation
      toggleSidebar: () => set((state) => ({
        isSidebarOpen: !state.isSidebarOpen,
      })),
      
      toggleMobileMenu: () => set((state) => ({
        isMobileMenuOpen: !state.isMobileMenuOpen,
      })),
      
      closeMobileMenu: () => set({ isMobileMenuOpen: false }),
      
      // HUD
      toggleHUD: () => set((state) => ({ showHUD: !state.showHUD })),
      toggleMinimap: () => set((state) => ({ showMinimap: !state.showMinimap })),
      toggleChat: () => set((state) => ({ showChat: !state.showChat })),
      setShowHUD: (showHUD) => set({ showHUD }),
      
      // Transiciones
      setTransitioning: (isTransitioning) => set({ isTransitioning }),
    }),
    { name: 'UIStore' }
  )
);

// Helper hooks
export const useLoading = () => useUIStore((state) => ({
  isLoading: state.isLoading,
  message: state.loadingMessage,
  progress: state.loadingProgress,
  setLoading: state.setLoading,
  setProgress: state.setLoadingProgress,
}));

export const useModal = () => useUIStore((state) => ({
  activeModal: state.activeModal,
  modalData: state.modalData,
  openModal: state.openModal,
  closeModal: state.closeModal,
}));

export const useToasts = () => useUIStore((state) => ({
  toasts: state.toasts,
  addToast: state.addToast,
  removeToast: state.removeToast,
  clearToasts: state.clearToasts,
}));
