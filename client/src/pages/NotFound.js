import not_found from "../assets/not_found.svg";

const NotFound = ({ page }) => {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center vh-100">
      <img src={not_found} alt="not found" className="img-fluid"/>
      <h1>Page {page} is not found</h1>
    </div>
  );
};

export default NotFound;
