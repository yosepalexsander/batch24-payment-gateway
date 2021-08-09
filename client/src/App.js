import { useContext, useEffect } from "react";
import { Switch, Route, useHistory } from "react-router-dom";
import { UserContext } from "./context/userContext";

import Auth from "./pages/Auth";
import Product from "./pages/Product";
import DetailProduct from "./pages/DetailProduct";
import Complain from "./pages/Complain";
import Profile from "./pages/Profile";
import ComplainAdmin from "./pages/ComplainAdmin";
import CategoryAdmin from "./pages/CategoryAdmin";
import ProductAdmin from "./pages/ProductAdmin";
import UpdateCategoryAdmin from "./pages/UpdateCategoryAdmin";
import AddCategoryAdmin from "./pages/AddCategoryAdmin";
import AddProductAdmin from "./pages/AddProductAdmin";
import UpdateProductAdmin from "./pages/UpdateProductAdmin";

import { API } from "./config/api";
import NotFound from "./pages/NotFound";

function App() {
  const api = API();
  const history = useHistory();
  const [state, dispatch] = useContext(UserContext);

  const checkUser = async () => {
    try {
      const config = {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.token,
        },
      };
      const response = await api.get("/check-auth", config);

      // If the token incorrect
      if (response.status === "failed") {
        dispatch({
          type: "AUTH_ERROR",
        });
        history.push('/auth')
        return
      }

      // // Get user data
      let payload = response.data.user;
      // // Get token from local storage
      payload.token = localStorage.token;

      // // Send data to useContext
      dispatch({
        type: "USER_SUCCESS",
        payload,
      });
      
      if (state.user.status === "admin") {
        history.push("/complain-admin");
        // history.push("/complain-admin");
      } else if (state.user.status === "customer") {
        history.push("/");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  return (
    <Switch>
      <Route exact path="/" component={Product} />
      <Route exact path="/auth" component={Auth} />
      <Route exact path="/product/:id" component={DetailProduct} />
      <Route exact path="/complain" component={Complain} />
      <Route exact path="/profile" component={Profile} />
      <Route exact path="/complain-admin" component={ComplainAdmin} />
      <Route exact path="/category-admin" component={CategoryAdmin} />
      <Route exact path="/edit-category/:id" component={UpdateCategoryAdmin} />
      <Route exact path="/add-category" component={AddCategoryAdmin} />
      <Route exact path="/product-admin" component={ProductAdmin} />
      <Route exact path="/add-product" component={AddProductAdmin} />
      <Route exact path="/edit-product/:id" component={UpdateProductAdmin} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

export default App;
