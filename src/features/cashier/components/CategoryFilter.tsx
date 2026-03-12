import { Category } from '@/types'
import { cn } from '@/lib/utils'
import { 
  LayoutGrid, 
  Utensils, 
  Coffee, 
  Smartphone, 
  Shirt, 
  Search,
  MoreHorizontal
} from 'lucide-react'

const categories: Category[] = [
  { id: 'all', name: 'Semua', icon: 'LayoutGrid' },
  { id: 'food', name: 'Makanan', icon: 'Utensils' },
  { id: 'drink', name: 'Minuman', icon: 'Coffee' },
  { id: 'electronics', name: 'Elektronik', icon: 'Smartphone' },
  { id: 'fashion', name: 'Fashion', icon: 'Shirt' },
  { id: 'other', name: 'Lainnya', icon: 'MoreHorizontal' },
]

const iconMap: Record<string, any> = {
  LayoutGrid,
  Utensils,
  Coffee,
  Smartphone,
  Shirt,
  MoreHorizontal,
}

interface CategoryFilterProps {
  selectedCategory: string
  onSelectCategory: (id: string) => void
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon] || LayoutGrid
        const isActive = selectedCategory === cat.id

        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              "flex items-center gap-2.5 px-5 py-3 rounded-2xl border transition-all whitespace-nowrap font-semibold text-sm",
              isActive 
                ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25 translate-y-[-2px]" 
                : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:bg-accent/50 active:scale-95"
            )}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
