import React from 'react';

const BackgroundDecoration: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Blurred background images */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-orange-50/30 to-yellow-50/30" />
      
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-[url('/images/kerala-food-1.jpg')] bg-cover opacity-20 blur-2xl transform -translate-x-1/4 -translate-y-1/4 rotate-12" />
      
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[url('/images/kerala-food-2.jpg')] bg-cover opacity-20 blur-2xl transform translate-x-1/4 -translate-y-1/2 -rotate-12" />
      
      <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-[url('/images/kerala-food-3.jpg')] bg-cover opacity-20 blur-2xl transform -translate-y-1/4 rotate-45" />
      
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-transparent" />
    </div>
  );
};

export default BackgroundDecoration; 