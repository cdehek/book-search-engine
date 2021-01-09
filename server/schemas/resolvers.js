const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        // me: async (parent, { user }) => {
        //   const foundUser = await User.findOne({
        //     $or: [{ _id: user ? user._id : params.id }, { username: params.username }],
        //   });
        //   return foundUser;
        // },
        me: async (parent, args, context) => {
          if (context.user) {
            const userData = await User.findOne({})
              .select('-__v -password')
              .populate('books');
    
            return userData;
          }
          throw new AuthenticationError('Not logged in');
        },
        users: async () => {
          return User.find()
            .select('-__v -password')
            .populate('books');
        }
    
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
            throw new AuthenticationError('Incorrect credentials');
          }
    
          const correctPw = await user.isCorrectPassword(password);
    
          if (!correctPw) {
            throw new AuthenticationError('Incorrect credentials');
          }
    
          const token = signToken(user);
          return { token, user };
        },
        saveBook: async (parent, { book }, context) => {
          if (context.user) {
            const user = await User.findByIdAndUpdate(
              { _id: context.user._id },
              { $push: { savedBooks: book } },
              { new: true }
            );
    
            return user;
          }
          throw new AuthenticationError('Not logged in');
        },
        removeBook: async(parent, { bookId }, context) => {
            if (context.user) {
                const user = await User.findByIdAndUpdate(
                    { _id: context.user_id },
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                );
                return user;
            }
            throw new AuthenticationError('You are not logged in!');
        }
      }
};

module.exports = resolvers;