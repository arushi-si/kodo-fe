function Loader({ className = "py-20" }) {
  return (
    <div className={`flex justify-center ${className}`}>
      <span className="loading loading-spinner loading-lg" aria-label="Loading" />
    </div>
  );
}

export default Loader;
