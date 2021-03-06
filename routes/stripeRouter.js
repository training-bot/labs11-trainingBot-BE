//Dependencies
const router = require("express").Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// const stripe = require('stripe')('sk_test_I3A5cCkzbD6C7HqqHSt7uRHH00ht9noOJw');


const Users = require("../database/Helpers/user-model.js");

// pass in stripeID
async function getStripeUser(stripeID) {
  try {
    return await stripe.customers.retrieve(stripeID);
  } catch (error) {
    console.log(error);
  }
}

// pass in stripeID and plan ID
async function subscribe(stripeID, plan) {
  try {
    return await stripe.subscriptions.create({
      customer: stripeID,
      items: [{ plan: plan }]
    });
  } catch (error) {
    console.log(error);
  }
}

// pass in subscription ID
async function unsubscribe(userID, stripeID, plan) {
  try {
    let customer = await getStripeUser(stripeID);
    console.log("unsubscribe customer", customer.subscriptions.data[0].id);
    let subID = customer.subscriptions.data[0].id;
    await stripe.subscriptions.del(subID);
    updateUserAccountType(userID, plan);
  } catch (error) {
    console.log(error);
  }
}

async function register(userID, name, email, token) {
  try {
    let customer = await stripe.customers.create({
      description: name,
      email: email,
      source: token // obtained with Stripe.js
    });
    Users.updateUser(userID, { stripe: customer.id });
    return customer;
  } catch (error) {
    console.log(error);
  }
}

function updateUserAccountType(userID, plan) {

// LIVE
    let accountTypeID;
    if (plan === "plan_EtJQBX3qzlXOiS") {
      // LIVE - PREMIUM PLAN
      accountTypeID = 2;
    } else if (plan === "plan_EtJQifGGbeQWq2") {
      // LIVE - PRO PLAN
      accountTypeID = 3;
    } else {
      accountTypeID = 1;
    }
    console.log("AccountTypeID", accountTypeID);
    Users.updateUser(userID, { accountTypeID: accountTypeID });

// TEST
    // let accountTypeID;
    // if (plan === "plan_EmJallrSdkqpPS") {
	// 	// TEST - PREMIUM PLAN
	// 	accountTypeID = 2;
    // } else if (plan === "plan_EmJaXZor4Ef3co") {
	// 	// TEST - PRO PLAN
    //   accountTypeID = 3;
    // } else {
    //   accountTypeID = 1;
    // }
    // console.log("AccountTypeID", accountTypeID);
    // Users.updateUser(userID, { accountTypeID: accountTypeID });
}

router.post("/", async (req, res) => {
  const { token, name, email, userID, stripe, plan } = req.body;
  if (stripe) {
    try {
      let customer = await getStripeUser(stripe);

      if (customer.subscriptions.total_count === 0) {
        let subscription = await subscribe(stripe, plan);
        updateUserAccountType(userID, plan);
        res.status(200).json(subscription);
      } else {
        await unsubscribe(userID, stripe);
        let subscription = await subscribe(stripe, plan);
        updateUserAccountType(userID, plan);

        res.status(200).json(subscription);
      }
    } catch (err) {
      console.log(err);
      res.status(500).end();
    }
  } else {
    try {
      let customer = await register(userID, name, email, token);
      let stripe = customer.id;
      await subscribe(stripe, plan);
      updateUserAccountType(userID, plan);

      console.log(customer);
      res.send(customer);
    } catch (err) {
      res.status(500).end();
    }
  }
});
router.post("/register", async (req, res) => {
  console.log("register");
  const { token, name, email, userID, plan } = req.body;

  try {
    let customer = await register(userID, name, email, token);
    let stripe = customer.id;
    await subscribe(stripe, plan);
    customer = await getStripeUser(customer.id);
    updateUserAccountType(userID, plan);

    console.log("customer", customer);
    res.send(customer);
  } catch (err) {
    res.status(500).end();
  }
});

router.post("/unsubscribe", async (req, res) => {
  const { userID, stripe } = req.body;
  // console.log('req body', req.body);
  if (stripe) {
    try {
      let res = unsubscribe(userID, stripe);
      updateUserAccountType(userID);

      res.status(404);
    } catch (err) {
      res.send(err);
    }
  }
});

router.get("/plans", async (req, res) => {
  try {
// LIVE
    stripe.plans.list(
      {
        limit: 3,
        product: "prod_EtJPhVbHZqV4nF" // LIVE
      },
      function(err, plans) {
        // console.log('plans', plans.data);
        res.send(plans.data);
      }
	)

// TEST
	// 	stripe.plans.list(
    //   {
    //     limit: 3,
    //     product: 'prod_EmJZbRNGEjlOY4', // TEST
    //   },
    //   function(err, plans) {
    //     console.log('plans', plans.data);
    //     res.send(plans.data);
    //   }
	// )

  } catch (error) {
    console.log(error);
  }
});
router.get("/subscriptions", async (req, res) => {
  try {
    await stripe.subscriptions.list(
      {
        limit: 3
      },
      function(err, subscriptions) {
        res.send(subscriptions.data);
      }
    );
  } catch (error) {
    console.log(error);
  }
});
router.get("/customer/plan", async (req, res) => {
  console.log("customer plan", req.body);
  try {
    await stripe.customers.retrieve(req.body.stripe, function(err, customer) {
      res.send(customer);
    });
  } catch (error) {
    console.log(error);
  }
});

// Cancel subscription route

router.post("/paymentintent", async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099,
      currency: "usd",
      payment_method_types: ["card"]
    });
    res.json({ paymentIntent });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;

// {
//     "paymentIntent": {
//         "id": "pi_1EIOHVChlDwQi04I8wjlU0WJ",
//         "object": "payment_intent",
//         "amount": 1099,
//         "amount_capturable": 0,
//         "amount_received": 0,
//         "application": null,
//         "application_fee_amount": null,
//         "canceled_at": null,
//         "cancellation_reason": null,
//         "capture_method": "automatic",
//         "charges": {
//             "object": "list",
//             "data": [],
//             "has_more": false,
//             "total_count": 0,
//             "url": "/v1/charges?payment_intent=pi_1EIOHVChlDwQi04I8wjlU0WJ"
//         },
//         "client_secret": "pi_1EIOHVChlDwQi04I8wjlU0WJ_secret_whxC5w22vn5KAyLK6ANM3z7n9",
//         "confirmation_method": "publishable",
//         "created": 1553641329,
//         "currency": "usd",
//         "customer": null,
//         "description": null,
//         "last_payment_error": null,
//         "livemode": false,
//         "metadata": {},
//         "next_action": null,
//         "on_behalf_of": null,
//         "payment_method_types": [
//             "card"
//         ],
//         "receipt_email": null,
//         "review": null,
//         "shipping": null,
//         "source": null,
//         "statement_descriptor": null,
//         "status": "requires_payment_method",
//         "transfer_data": null,
//         "transfer_group": null
//     }
// }
