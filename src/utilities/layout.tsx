import NavBar from './nav-bar';

export default function Layout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/**Contenedo principal */}
      <div className="m-0 box-border border-0 h-screen w-screen p-2 flex flex-col bg-slate-50 md:flex md:flex-row md:gap-2">
        {/**Barra de menú */}
        <NavBar />
        {/* Contenedor principal ubicadó a la derecha del menú en dispositivos de pantalla grande y en toda la pantalla en móviles */}
        <div className="grow w-full p-9 flex flex-col gap-2 bg-gradient-to-b bg-white rounded-lg drop-shadow-lg md:p-12 overflow-auto">
          {children}
        </div>
      </div>
    </>
  );
}
