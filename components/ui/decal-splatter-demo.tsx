import React from 'react';
import { DecalSplatter } from './decal-splatter';

export const DecalSplatterDemo: React.FC = () => {
  return (
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-2 gap-8">
        {/* Basic red splatter */}
        <div className="p-4 border rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Basic Red Splatter</h3>
          <DecalSplatter color="#ff0000" size={150} count={8} />
        </div>

        {/* Blue splatter with more spread */}
        <div className="p-4 border rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Blue Splatter with Spread</h3>
          <DecalSplatter color="#0066ff" size={150} count={8} spread={40} />
        </div>

        {/* Green splatter with rotation */}
        <div className="p-4 border rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Green Splatter with Rotation</h3>
          <DecalSplatter color="#00ff00" size={150} count={8} rotation={45} />
        </div>

        {/* Multiple small splatters */}
        <div className="p-4 border rounded-lg">
          <h3 className="mb-4 text-lg font-semibold">Multiple Small Splatters</h3>
          <DecalSplatter color="#ff00ff" size={150} count={15} spread={30} />
        </div>
      </div>
    </div>
  );
}; 