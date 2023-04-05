const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");


/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  // console.log("what user include",user)
  const cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  return cart;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
  try {
    const { email } = user;
    let getUser = await Cart.findOne({email})
    // console.log("getUser",getUser)
    if (!getUser) {
      let createCartItems = await Cart.create({ email , cartItems: [],
        paymentOption: config.default_payment_option,});
      if(!createCartItems){
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "");
      }
      let cartItems = await createCartItems.save();
      // console.log("cartItems",cartItems)
      
    }

    let getUserCart = await Cart.findOne({ email });
    // console.log("getUserCart",getUserCart)
    if (
      getUserCart.cartItems.some(
        (value) => value.product["_id"].toString() === productId
      )
    ) {
      // console.log("isItemsAlreadyPresentInCart")
      throw new ApiError(httpStatus.BAD_REQUEST, "Product already in cart");
    }



    let product = await Product.findById({ _id: productId });
    // console.log("!!product",product,!!product)
    if (!product) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product doesn't exist in database"
      );
    }




    let cart = { product, quantity };
    // console.log("cart------",cart)
    // const udpateCart = await Cart.findOneAndUpdate(
    //   { email },
    //   { $push: { cartItems: cart } },
    //   { new: true }
    // );

    getUserCart.cartItems=[...getUserCart.cartItems,cart]


    // console.log("udapteCart",udpateCart.cartItems)

    let udpateCart=await getUserCart.save();
    
    // console.log("udapteCart",udpateCart)
    return udpateCart;
  } catch (error) {
    throw error;
  }
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  try {
    const { email } = user;
    
    let getUser = await Cart.findOne({ email });
    // console.log("getUser",getUser)
    if (!getUser) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User does not have a cart. Use POST to create cart and add a product"
      );
    }

    let product = await Product.findById({ _id: productId });
    // console.log("!!product",!!product)
    if (!product) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product doesn't exist in database"
      );
    }
    
    // if(!quantity){
    //   // delete if quantity 0 zero
    //   const deleteProduct=await deleteProductFromCart(user,productId);
    //   return deleteProduct;
    // }



    let getIndexOfProduct=getUser.cartItems.findIndex(
      (value) => value.product["_id"].toString() === productId
    )
    
      if (
        getIndexOfProduct<0
      ) {
        // console.log("isItemsAlreadyPresentInCart")
        throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart")
      }
    
        
    
      getUser.cartItems[getIndexOfProduct].quantity=quantity
    
      let updatedUsersCart=await getUser.save();

      // console.log("updatedUsersCart",updatedUsersCart)

    // const updateProduct = await Cart.findOneAndUpdate(
    //   {
    //     email,  
    //   },
    //   {$set:{ 'cartItems.$[item].quantity': quantity }}
    //   ,
    //   {arrayFilters:[{'item.product._id': productId }],new:true }
    // );

    // console.log("prodcut",typeof updateProduct.cartItems[0].product)
    // console.log("updateProductInCart",productId, quantity);
    // console.log("updateProductQuantity", updateProduct);

      return updatedUsersCart;
    // return updateProduct;
  } catch (error) {
    throw error;
  }
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  const { email } = user;

   let product = await Product.findById({ _id: productId });
  //   if (!product) {
  //     throw new ApiError(
  //       httpStatus.BAD_REQUEST,
  //       "Product doesn't exist in database"
  //     );
  //   }


  let getUser = await Cart.findOne({ email });
    // console.log("getUser",getUser)
    if (!getUser) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User does not have a cart"
      );
    }

let getIndexOfProduct=getUser.cartItems.findIndex(
  (value) => value.product["_id"].toString() === productId
)


  // console.log("getIndexOfProduct",getIndexOfProduct)

  if (
    getIndexOfProduct<0
  ) {
    // console.log("isItemsAlreadyPresentInCart")
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart")
  }

    
getUser.cartItems=getUser.cartItems.filter((value,index)=>index!==getIndexOfProduct);
  // getUser.cartItems.splice(getIndexOfProduct,1)

  let updatedUsersCart=await getUser.save();



  // const deleteProduct = await Cart.findOneAndUpdate(
  //   {
  //     email,  
  //   },
  // {$pull:{ cartItems:{ "product._id":productId}}},{new:true}
  // );

  // ,{arrayFilters:[{'item.product._id': productId }],new:true }

  // console.log("updatedUsersCart",updatedUsersCart)

return updatedUsersCart;
  // return deleteProduct;
};

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
  // TODO - User does not have a cart

  let cart = await Cart.findOne({ email: user.email });
    // console.log("cart",cart)
  if (!cart) {
    // console.log("uesr dont have cart")
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  
  // TODO -  Cart is empty
  
  if (cart.cartItems.length === 0) {
    // console.log("cart is empty")
    throw new ApiError(httpStatus.BAD_REQUEST, "Cart is empty");
  }
 
  
  // TODO -  Address not set
  
  let hasSetNonDefaultAddress = await user.hasSetNonDefaultAddress();
//  console.log("addrssnottoset",hasSetNonDefaultAddress)
  if (!hasSetNonDefaultAddress) {
    // console.log("address not set")
    throw new ApiError(httpStatus.BAD_REQUEST, "Address not set");
  }
  

  // TODO - User has insufficient money to process
  let total = 0;
  for (let i = 0; i < cart.cartItems.length; i++) {
    total += cart.cartItems[i].product.cost * cart.cartItems[i].quantity;
  }

// console.log("walletmoney-----------",user.walletMoney)


  if (total > user.walletMoney) {
    // console.log("insufficient money")
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User has insufficient money to process"
    );
  }

  // TODO - User has valid cart
  user.walletMoney -= total;
  await user.save();

  cart.cartItems = [];
 return  await cart.save();

};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
