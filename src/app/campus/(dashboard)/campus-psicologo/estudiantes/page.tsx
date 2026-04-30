import React from 'react';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">
          Nueva Página
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Este es un componente de página simple en Next.js.
        </p>
      </div>
    </main>
  );
}