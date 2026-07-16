import  {createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [ cart, setCart ] = useState(() =>{
        const savedCart = localStorage.getItem('pizzaria_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() =>{
        localStorage.setItem('pizzaria_cart', JSON.stringify(cart));
        }, [cart]);

        const addToCart = (product) =>{
            setCart((prevCart) =>{
                const existingItem = prevCart.find((item) => item.id === product.id);
                if (existingItem) {
                    return prevCart.map((item)=>{
                        item.id === product.id ? {...item, quantity: item.quantity + 1} : item
                    });
                }
                return [...prevCart, {...product, quantity: 1}];
            });
        };

        const removeFromCart = (productId) =>{
            setCart((prevCart) =>{
                const existingItem = prevCart.find((item)=> item.id === productId);
                if (existingItem?.quantity === 1){
                    return prevCart.filter((item) => item.id !== productId);
                }
                return prevCart.map((item) =>{
                    item.id === productId ? {...item, quantity: item.quantity - 1 } : item
                });
            });
        };
        
        const removeItemComplety = (productId) =>{
            setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
        };

        const clearCart = () => {
            setCart([]);
        };

        const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity , 0);
        const cartCount = cart.reduce((count, item ) => count + item.quantity, 0);

        return (
            <CartContext.Provider value={{
                cart,
                addToCart,
                removeFromCart,
                removeItemComplety,
                clearCart,
                cartTotal,
                cartCount
            }}>
                {children}
            </CartContext.Provider>
        );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart deve ser usado dentro de um CartProvider');
    }
    return context;
}