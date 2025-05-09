import NavBar from './nav-bar';

export default function Layout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/**Contenedo principal */}
      <div className="m-0 box-border border-0 h-screen w-screen flex flex-col bg-[#DDD8D3] md:flex md:flex-row md:p-2">
        {/* Contenedor que agrupa NavBar + Panel derecho */}
        <div className="h-full w-full flex flex-col md:flex-row md:rounded-lg md:shadow-lg bg-white overflow-hidden">
          {/**Barra de menú */}
          <NavBar />
          {/* Contenedor principal ubicadó a la derecha del menú en dispositivos de pantalla grande y en toda la pantalla en móviles */}
          <div className="grow w-full p-4 flex flex-col gap-2 bg-gradient-to-b bg-white md:p-12 overflow-auto md:rounded-tr-md md:rounded-br-md">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
