import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product} from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart];
      const productExist = updateCart.find(
        (product) => product.id === productId
      );
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      const CurrentAmount = productExist ? productExist.amount: 0;
      const amount = CurrentAmount + 1;
      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }
      if (productExist) {
        productExist.amount = amount;
        // console.log('incrementou produto no carrinho', productExist)
      } else {
        const findProduct = await api.get(`/products/${productId}`);
        const newProduct = {
          ...findProduct.data,
          amount: 1
        };
        updateCart.push(newProduct);
        // console.log("adicionou produto no carrinho",updateCart)
        setCart(updateCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = [...cart];
      const Index = updateCart.findIndex(
        (product) => product.id === productId
      );
      if (Index>= 0) {
        updateCart.splice(Index,1);
        // console.log('removendo item',Index)
        setCart(updateCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      }else{
        throw Error()
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount<=0){
        return
      }
      const stock = await api.get(`/stock/${productId}`)
      const currentAmount = stock.data.amount

      if(amount>currentAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      const updateCart = [...cart]
      const productExist = updateCart.find((product)=>product.id===productId)
      if(productExist){
        // e possível alterar o objeto diretamente pois o find passa a referencia do objeto
        productExist.amount = amount
        // console.log("updated amount")
        setCart(updateCart)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
      }else{
        throw Error()
      }
      
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
