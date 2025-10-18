import React from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '',
  ...props 
}) => {
  if (!isOpen) return null;
  
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-7xl'
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`relative transform overflow-hidden rounded-2xl bg-white text-left shadow-strong transition-all sm:my-8 sm:w-full ${sizes[size]} ${className}`} {...props}>
          {/* Header */}
          {title && (
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
            </div>
          )}
          
          {/* Content */}
          <div className="px-6 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const ModalHeader = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-b border-neutral-200 ${className}`} {...props}>
    {children}
  </div>
);

const ModalTitle = ({ children, className = '', ...props }) => (
  <h3 className={`text-lg font-semibold text-neutral-900 ${className}`} {...props}>
    {children}
  </h3>
);

const ModalContent = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-6 ${className}`} {...props}>
    {children}
  </div>
);

const ModalFooter = ({ children, className = '', ...props }) => (
  <div className={`px-6 py-4 border-t border-neutral-200 bg-neutral-50 ${className}`} {...props}>
    <div className="flex justify-end space-x-3">
      {children}
    </div>
  </div>
);

Modal.Header = ModalHeader;
Modal.Title = ModalTitle;
Modal.Content = ModalContent;
Modal.Footer = ModalFooter;

export default Modal;

