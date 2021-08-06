const { user, transaction, product, profile } = require("../../models");

const midtransClient = require('midtrans-client');
const nodemailer = require('nodemailer')

exports.getTransactions = async (req, res) => {
  try {
    const idBuyer = req.user.id;
    let data = await transaction.findAll({
      where: {
        idBuyer,
      },
      order: [["createdAt", "DESC"]],
      attributes: {
        exclude: ["updatedAt", "idBuyer", "idSeller", "idProduct"],
      },
      include: [
        {
          model: product,
          as: "product",
          attributes: {
            exclude: [
              "createdAt",
              "updatedAt",
              "idUser",
              "qty",
              "price",
              "desc",
            ],
          },
        },
        {
          model: user,
          as: "buyer",
          attributes: {
            exclude: ["createdAt", "updatedAt", "password", "status"],
          },
        },
        {
          model: user,
          as: "seller",
          attributes: {
            exclude: ["createdAt", "updatedAt", "password", "status"],
          },
        },
      ],
    });

    data = JSON.parse(JSON.stringify(data));

    data = data.map((item) => {
      return {
        ...item,
        product: {
          ...item.product,
          image: process.env.PATH_FILE + item.product.image,
        },
      };
    });

    res.send({
      status: "success",
      data,
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: "failed",
      message: "Server Error",
    });
  }
};

exports.addTransaction = async (req, res) => {
  try {
    const data = {
      id: parseInt(req.body.idProduct + Math.random().toString().substr(3,8)),
      ...req.body,
      idBuyer: req.user.id,
      status: "pending"
    }

    const newTransaction = await transaction.create(data)

    const buyerData = await user.findOne({
      where: {
        id: req.user.id
      },
      include: {
        model: profile,
        as: "profile",
        attributes: {
          exclude: ['createdAt', 'updatedAt', 'idUser']
        }
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'password']
      }
    })

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
    })

    const parameter = {
      "transaction_details": {
          "order_id": newTransaction.id,
          "gross_amount": newTransaction.price
      },
      "credit_card":{
          "secure" : true
      },
      "customer_details": {
          "full_name": buyerData.name,
          "email": buyerData.email,
          "phone": buyerData.profile?.phone
      }
    };

    const payment = await snap.createTransaction(parameter)

    res.send({
      status: "pending",
      message: "Pending transaction payment gateway",
      payment,
      product: {
        id: data.idProduct,
      },
    });
  } catch (error) {
    console.log(error);
    res.send({
      status: "failed",
      message: "Server Error",
    });
  }
};

const core = new midtransClient.CoreApi()

core.apiConfig.set({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
})

/**
 *  Handle update transaction status after notification
 * from midtrans webhook
 * @param {string} status
 * @param {transactionId} transactionId
 */

exports.notification = async (req, res) => {
  try {
    const statusResponse = await core.transaction.notification(req.body);
    let orderId = statusResponse.order_id;
    let transactionStatus = statusResponse.transaction_status;
    let fraudStatus = statusResponse.fraud_status;

    if (transactionStatus == 'capture'){
        if (fraudStatus == 'challenge'){
            updateTransaction(orderId, 'pending')
            res.status(200)
          } else if (fraudStatus == 'accept'){
            updateTransaction(orderId, 'success')
            sendEmail(orderId, 'success')
            updateProduct(orderId)
            res.status(200)
          }
    } else if (transactionStatus == 'settlement'){
      sendEmail(orderId, 'success')
      updateTransaction(orderId, 'success')
      updateProduct(orderId)
      res.status(200)
    } else if (transactionStatus == 'cancel' ||
    transactionStatus == 'deny' ||
    transactionStatus == 'expire'){
      updateTransaction(orderId, 'failed')
      res.status(200)
    } else if (transactionStatus == 'pending'){
      updateTransaction(orderId, 'pending')
      res.status(200)
    }
  } catch (error) {
    res.status(500)
  }
}

// update transaction status
const updateTransaction = async (id, status) => {
  await transaction.update({
    status
  }, {
    where: {
      id
    }
  })
}

// update stock product
const updateProduct = async (orderId) => {
  const transactionData = await transaction.findOne({
    where: {
      id: orderId
    }
  })

  const productData = await product.findOne({
    where: {
      id: transactionData.idProduct
    }
  })

  const qty = productData.qty - 1
  await product.update({ qty }, 
    { 
      where: {
        id: productData.id
      } 
    }) 
}

const sendEmail = async (transactionId, status) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SYSTEM_EMAIL,
      pass: process.env.SYSTEM_PASSWORD
    }
  })


  const data = await transaction.findOne({
    where: {
      id: transactionId,
    },
    include: [
      {
        model: user,
        as: 'buyer',
        attributes: {
          exclude: ["createdAt", "updatedAt", "password"]
        }
      },
      {
        model: product,
        as: 'product',
        attributes: {
          exclude: ["createdAt", "updatedAt", "idUser", "qty", "price", "desc"]
        }
      },
    ]
  })

  const mailOptions = {
    from: process.env.SYSTEM_EMAIL,
    to: data.buyer.email,
    subject: 'Payment status',
    html: `
      <h1 style="color:red; font-weight: bold;">Product payment :</h1>
      <ul style="list-style-type:none;">
        <li>Name: ${data.product.name}</li>
        <li>Amount: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data.price)}</li>
        <li>Status: ${status}</li>
      </ul>
    `
  }

  if(data.status !== status) {
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) throw err;
      console.log('Email sent: ', info.response);
    })
  }
}
