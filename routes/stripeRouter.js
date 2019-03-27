//Dependencies
const router = require('express').Router();
const stripe = require('stripe')('sk_test_I3A5cCkzbD6C7HqqHSt7uRHH00ht9noOJw');

const Users = require('../database/Helpers/user-model.js');

// stripe.charges.retrieve('ch_1EHzLXChlDwQi04Iono5543P', {
// 	api_key: 'sk_test_I3A5cCkzbD6C7HqqHSt7uRHH00ht9noOJw',
// });

function subscribe(stripeID, userID) {
	// API for subscribing a custoemr to a plan on Stripe
	stripe.subscriptions.create(
		{
			customer: stripeID,
			items: [
				{
					plan: 'plan_ElvuS8dCu0De0C',
				},
			],
		},
		function(err, subscription) {
			// asynchronously called
			const changes = { accountTypeID: 3 };
			// updates accountTypeID for the user in the database
			Users.updateUser(userID, changes); 
			return subscription;
		}
		);
	}
	function registerSubscribe(name, email, token, userID) {
		// API for creating a customer in Stripe's system
		stripe.customers.create(
			{
				description: name,
				email: email,
				source: token, // obtained with Stripe.js
			},
			function(err, customer) {
				// asynchronously called
			// add strip user_id to the database
			const changes = { stripe: customer.id };
			Users.updateUser(userID, changes);

			// calls subscribe function to subsribe the user
			let sub = subscribe(customer.id, userID);
			return sub;
		}
	);
}

router.post('/', async (req, res) => {
	const { token, name, email, userID, stripe } = req.body;
	if (stripe) {
		try {
			console.log('Subscribe Only');

			// calls subscribe function to subsribe the user
			let sub = subscribe(stripe, userID);
			res.status(200).json(sub);
		} catch (err) {
			res.status(500).end();
		}
	} else {
		try {
			console.log('Register & Subscribe');

			// calls registerSubscribe function to register and then subsribe the user to the plan
			let sub =  registerSubscribe(name, email, token, userID);
			res.status(200).json(sub);
		} catch (err) {
			res.status(500).end();
		}
	}
});

// Cancel subscription route

router.post('/paymentintent', async (req, res) => {
	const paymentIntent = await stripe.paymentIntents.create({
		amount: 1099,
		currency: 'usd',
		payment_method_types: ['card'],
	});
	res.json({ paymentIntent });
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