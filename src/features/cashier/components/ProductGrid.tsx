import { Product } from '@/types'
import { Plus, Info, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePosStore } from '@/store/usePosStore'

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
}

export default function ProductGrid({ products, isLoading }: ProductGridProps) {
  const addToCart = usePosStore((state) => state.addToCart)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 animate-pulse">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-accent/40 rounded-3xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
      <AnimatePresence mode='popLayout'>
        {products.map((product, index) => (
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            key={product.id}
            onClick={() => addToCart(product)}
            className="group relative bg-card rounded-[2rem] border border-border/50 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 active:scale-95 flex flex-col h-full"
          >
            {/* Image Section */}
            <div className="aspect-[4/3] w-full overflow-hidden bg-accent/20 relative">
              <img 
                src={product.image || 'https://via.placeholder.com/200?text=Produk'} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {product.category}
              </div>
              
              {product.stock < 10 && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                  <AlertCircle size={10} />
                  Sisa {product.stock}
                </div>
              )}
            </div>

            {/* Info Section */}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-bold text-sm lg:text-base line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              
              <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                <p className="text-primary font-black text-base lg:text-lg tracking-tight">
                  Rp {product.price.toLocaleString('id-ID')}
                </p>
                
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Plus size={18} strokeWidth={3} />
                </div>
              </div>
            </div>

            {/* Hover Indicator */}
            <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/40 rounded-[2rem] transition-all pointer-events-none" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
