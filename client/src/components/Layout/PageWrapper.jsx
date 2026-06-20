export default function PageWrapper({ title, children }) {
  return (
    <div className="page-wrapper">
      {title && <h1>{title}</h1>}
      {children}
    </div>
  );
}
