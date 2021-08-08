// import useContext hook
import { useState, useEffect, useContext, useCallback } from "react";
import { Container, Row, Col } from "react-bootstrap";

import Navbar from "../components/Navbar";

import Contact from "../components/complain/Contact";
// import chat component
import Chat from "../components/complain/Chat";

// import user context
import { UserContext } from "../context/userContext";

// import socket.io-client
import { io } from "socket.io-client";

let socket;
export default function Complain() {
  const [contact, setContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);

  const title = "Complain admin";
  document.title = "DumbMerch | " + title;

  const [state] = useContext(UserContext);

  useEffect(() => {
    socket = io("http://localhost:5000", {
      auth: {
        token: localStorage.getItem("token"),
      },
      query: {
        id: state.user.id,
      },
    });
    socket.on("new message", () => {
      socket.emit("load messages", contact?.id);
    });
    socket.on("connect_error", (err) => {
      console.error(err.message);
    });

    const loadContact = () => {
      socket.emit("load admin contact");
      socket.on("admin contact", async (data) => {
        const dataContact = {
          ...data,
          message: messages.length > 0 ? messages[messages.length - 1].message : "Click here to start message",
        };
        setContacts([dataContact]);
      });
    };

    const loadMessages = () => {
      socket.on("messages", async (data) => {
        if ((data.length > 0) && (data.length !== messages.length)) {
          const dataMessages = data.map((item) => ({
            idSender: item.sender.id,
            message: item.message,
          }));
          setMessages(dataMessages);
        }
        const chatMessagesElm = document.getElementById("chat-messages");
        chatMessagesElm.scrollTop = chatMessagesElm?.scrollHeight;
      });
    };

    loadMessages();
    loadContact();
    return () => {
      socket.disconnect();
    };
  }, [messages]);

  const onClickContact = useCallback((data) => {
    setContact(data);
    socket.emit("load messages", data.id);
  }, []);

  const onSendMessage = useCallback(
    (e) => {
      if (e.key === "Enter") {
        const data = {
          idRecipient: contact.id,
          message: e.target.value,
        };
        socket.emit("send message", data);
        e.target.value = "";
      }
    },
    [contact?.id]
  );

  return (
    <>
      <Navbar title={title} />
      <Container fluid style={{ height: "89.5vh" }}>
        <Row>
          <Col md={3} style={{ height: "89.5vh" }} className="px-3 border-end border-dark overflow-auto">
            <Contact dataContact={contacts} clickContact={onClickContact} contact={contact} />
          </Col>
          <Col md={9} style={{ maxHeight: "89.5vh" }} className="px-0">
            <Chat contact={contact} messages={messages} user={state.user} sendMessage={onSendMessage} />
          </Col>
        </Row>
      </Container>
    </>
  );
}
