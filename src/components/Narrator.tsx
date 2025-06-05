import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Stage } from '@react-three/drei';
import { useBook } from '../context/BookContext';

function Model({ isReading }: { isReading: boolean }) {
  const { scene } = useGLTF('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Binary/Box.glb');
  
  return <primitive object={scene} scale={2} position={[0, -1, 0]} />;
}

const Narrator = () => {
  const { isReading } = useBook();

  return (
    <div className="absolute bottom-4 right-4 w-32 h-32 md:w-48 md:h-48">
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 50 }}>
        <Stage environment="city" intensity={0.6}>
          <Model isReading={isReading} />
        </Stage>
        <OrbitControls 
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
};

export default Narrator;