import "./docs.css";

// Applies a visitor's saved docs theme before the page paints (light is the
// default). Wrapped in try/catch: blocked storage falls back to light.
const themeScript = `try{if(localStorage.getItem("crate-docs-theme")==="dark")document.documentElement.dataset.docsTheme="dark"}catch(e){}`;

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      {children}
    </>
  );
}
