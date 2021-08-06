import { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";
import convertRupiah from "rupiah-format";

import Navbar from "../components/Navbar";

// Import useQuery and useMutation
import { useQuery, useMutation } from "react-query";

// API config
import { API } from "../config/api";

export default function DetailProduct() {
  let history = useHistory();
  let { id } = useParams();
  let api = API();

  // Fetching product data from database
  let { data: product, refetch } = useQuery("Cache", async () => {
    const config = {
      method: "GET",
      headers: {
        Authorization: "Basic " + localStorage.token,
      },
    };
    const response = await api.get("/product/" + id, config);
    return response.data;
  });

  useEffect(() => {
    const midtransScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js"

    const midtransClientKey = "SB-Mid-client-A3OQbgr_e6AlRfQc"

    let scriptTag = document.createElement("script");

    scriptTag.src = midtransScriptUrl
    scriptTag.setAttribute("data-client-key", midtransClientKey);

    document.body.appendChild(scriptTag)

    return () => {
      document.body.removeChild(scriptTag)
    }
  }, [])

  const handleBuy = useMutation(async () => {
    try {
      // Get data from product
      const data = {
        idProduct: product.id,
        idSeller: product.user.id,
        price: product.price,
      };

      // Data body
      const body = JSON.stringify(data);

      // Configuration
      const config = {
        method: "POST",
        headers: {
          Authorization: "Basic " + localStorage.token,
          "Content-type": "application/json",
        },
        body,
      };

      // Insert transaction data
      const responseNewTransaction = await api.post("/transaction", config);
      const token = responseNewTransaction.payment.token;

      window.snap.pay(token, {
        onSuccess: function(){
          console.log('success');
          history.push('/profile')
        },
        onPending: function(result){console.log('pending');console.log(result);},
        onError: function(result){console.log('error');console.log(result);},
        onClose: function(){console.log('customer closed the popup without finishing the payment');}
      })
    } catch (error) {
      console.log(error);
    }
  });

  return (
    <div>
      <Navbar />
      <Container className="py-5">
        <Row>
          <Col md="2"></Col>
          <Col md="3">
            <img src={product?.image} className="img-fluid" />
          </Col>
          <Col md="5">
            <div className="text-header-product-detail">{product?.name}</div>
            <div className="text-content-product-detail">
              Stock : {product?.qty}
            </div>
            <p className="text-content-product-detail mt-4">{product?.desc}</p>
            <div className="text-price-product-detail text-end mt-4">
              {convertRupiah.convert(product?.price)}
            </div>
            <div className="d-grid gap-2 mt-5">
              <button
                onClick={() => handleBuy.mutate()}
                className="btn btn-buy"
              >
                Buy
              </button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
