import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import SimplePlusButton from './SimplePlusButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = "max-w-4xl",
  className = ""
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonDesktopRef = useRef<HTMLDivElement>(null);
  const closeButtonMobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && overlayRef.current && modalRef.current && closeButtonDesktopRef.current && closeButtonMobileRef.current) {
      // Set initial states
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(modalRef.current, { opacity: 0, scale: 0.8, y: 30 });
      gsap.set(closeButtonDesktopRef.current, { opacity: 0, scale: 0.8 });
      gsap.set(closeButtonMobileRef.current, { opacity: 0, scale: 0.8 });

      // Animate in
      const tl = gsap.timeline();
      
      tl.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      })
      .to(modalRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "back.out(1.7)"
      }, "-=0.1")
      .to([closeButtonDesktopRef.current, closeButtonMobileRef.current], {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      }, "-=0.2");
    }
  }, [isOpen]);

  const handleClose = () => {
    if (overlayRef.current && modalRef.current && closeButtonDesktopRef.current && closeButtonMobileRef.current) {
      const tl = gsap.timeline({
        onComplete: onClose
      });
      
      tl.to([closeButtonDesktopRef.current, closeButtonMobileRef.current], {
        opacity: 0,
        scale: 0.8,
        duration: 0.2
      })
      .to(modalRef.current, {
        opacity: 0,
        scale: 0.8,
        y: 30,
        duration: 0.3,
        ease: "power2.in"
      }, "-=0.1")
      .to(overlayRef.current, {
        opacity: 0,
        duration: 0.2
      }, "-=0.1");
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Mobile close button - fixed to top-right of browser window */}
      <div ref={closeButtonMobileRef} className="fixed top-4 right-4 z-[60] w-12 h-12 md:hidden">
        <SimplePlusButton 
          onClick={handleClose}
          isActive={true}
          className="w-full h-full"
        />
      </div>

      <div 
        ref={modalRef}
        className={`bg-white rounded-2xl overflow-y-scroll overflow-x-hidden no-scrollbar ${maxWidth} w-full max-h-[90vh] overflow-y-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {/* Desktop close button - positioned inside modal */}
          <div ref={closeButtonDesktopRef} className="absolute top-4 right-4 z-10 w-10 h-10 hidden md:block">
            <SimplePlusButton 
              onClick={handleClose}
              isActive={true}
              className="w-full h-full"
            />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;