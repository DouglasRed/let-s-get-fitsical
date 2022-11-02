const { User } = require("../models");
const { AuthenticationError } = require("apollo-server-express");
const { signToken } = require("../utils/auth");
const fetch = require("node-fetch");
require("dotenv").config();

const resolvers = {
  Query: {
    users: async () => {
      return User.find().select("-__v -password");
    },
    user: async (parent, { username }) => {
      return User.findOne({ username }).select("-__v -password");
    },
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id }).select(
          "-__v -password"
        );

        return userData;
      }
      throw new AuthenticationError("not logged in");
    },
    workout: async (parent, args) => {
      const query = "biceps";
      const url = `https://exercises-by-api-ninjas.p.rapidapi.com/v1/exercises?muscle=${query}`;
      const options = {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": process.env.REACT_APP_RAPID_API_KEY,
          "X-RapidAPI-Host": "exercises-by-api-ninjas.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      };
      const response = await fetch(url, options);
      console.log("-------------------------------");
      console.log(response);
      const data = await response.json();
      console.log("-------------------------------");
      console.log(data);
      return data;
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("Incorrect Credentials");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect Credentials");
      }

      const token = signToken(user);
      return { token, user };
    },
  },
};

module.exports = resolvers;
