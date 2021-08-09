// import useContext hook
import { useState, useEffect, useContext, useCallback } from "react";
import { Container, Row, Col } from "react-bootstrap";

import NavbarAdmin from "../components/NavbarAdmin";

import Contact from "../components/complain/Contact";
// import chat component
import Chat from "../components/complain/Chat";

// import user context
import { UserContext } from "../context/userContext";

// import socket.io-client
import { io } from "socket.io-client";

// initial variable outside socket
let socket;
export default function ComplainAdmin() {
  const [contact, setContact] = useState(null);
  const [contacts, setContacts] = useState([]);
  // create messages state
  const [messages, setMessages] = useState([]);

  const title = "Complain admin";
  document.title = "DumbMerch | " + title;

  // consume user context
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
    const loadContacts = () => {
      socket.emit("load customer contacts");
      socket.on("customer contacts", (data) => {
        // filter just customers which have sent a message
        let dataContacts = data.filter(
          (item) => (item.status !== "admin") && (item.senderMessage.length > 0)
        );
        
        dataContacts = dataContacts.sort(
          (a,b) => new Date(b.senderMessage[0].createdAt) - new Date(a.senderMessage[0].createdAt)
          )
  
        dataContacts = dataContacts.map((item) => ({
          ...item,
          message:
          item.senderMessage.length > 0
              ? item.senderMessage[0].message
              : "Click here to start message",
          })
        );
        setContacts(dataContacts);
      });
    };
    const loadMessages = () => {
      // define listener on event "messages"
      socket.on("messages", (data) => {
        // get data messages
        if ((data.length > 0) && (data.length !== messages.length)) {
          const dataMessages = data.map((item) => ({
            idSender: item.sender.id,
            message: item.message,
          }));
          setMessages(dataMessages);
          const chatMessagesElm = document.getElementById("chat-messages");
          chatMessagesElm.scrollTop = chatMessagesElm?.scrollHeight;
        }
      });
    };
    // define listener for every updated message
    socket.on("new message", () => {
      socket.emit("load messages", contact?.id);
      loadContacts()
    });

    loadContacts();
    loadMessages();

    return () => {
      socket.disconnect();
    };
  }, [messages]);

  // used for active style when click contact
  const onClickContact = useCallback((data) => {
    setContact(data);
    // emit event load messages
    socket.emit("load messages", data.id);
  }, []);

  const onSendMessage = useCallback(
    (e) => {
      // listen only enter key event press
      if (e.key === "Enter") {
        const data = {
          idRecipient: contact.id,
          message: e.target.value,
        };
        //emit event send message
        socket.emit("send message", data);
        e.target.value = "";
      }
    },
    [contact?.id]
  );

  return (
    <>
      <NavbarAdmin title={title} />
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
