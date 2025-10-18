import { FC } from 'react';

interface IconMenuOrdersProps {
    className?: string;
}

const IconMenuOrders: FC<IconMenuOrdersProps> = ({ className }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 47.65 47.65" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <path fillRule="evenodd" clipRule="evenodd" d="M28.6 0v19.51a.68.68 0 0 1-1.17.55l-5-5.34a.65.65 0 0 0-1 0l-5 5.34a.68.68 0 0 1-1.17-.55V0Z" fill="currentColor" />
            <path
                opacity="0.5"
                d="M38.63 0h-7v25.57a1 1 0 0 1-1.71.73l-7.27-7a1 1 0 0 0-1.4 0l-7.27 7a1 1 0 0 1-1.71-.73V0H9.01a9 9 0 0 0-9 9v29.62a9 9 0 0 0 9 9h29.62a9 9 0 0 0 9-9V9.01a9 9 0 0 0-9-9.01Zm-6.22 42.35h-23a1.5 1.5 0 0 1 0-3h23a1.5 1.5 0 0 1 0 3Zm8.36-7H9.39a1.5 1.5 0 0 1 0-3h31.38a1.5 1.5 0 0 1 0 3Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default IconMenuOrders;
