const { gql } = require('apollo-server-express');

const typeDefs = gql`
	type User {
		userID: Int
		authToken: String
		accountType: String
	}

	type Query {
		getUsers: [User]!
	}
`;

module.exports = typeDefs;
