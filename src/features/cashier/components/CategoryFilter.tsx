import { cn } from '@/lib/utils'
import { 
  LayoutGrid, 
  Tag
} from 'lucide-react'
import { useInventoryStore } from '@/store/useInventoryStore'

interface CategoryFilterProps {
  selectedCategory: string
  onSelectCategory: (id: string) => void
}

export default function CategoryFilter({ selectedCategory, onSelectCategory }: CategoryFilterProps) {
  const categories = useInventoryStore((s) => s.categories)
  const all = [{ id: 'all', name: 'Semua' as const }]

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-4 no-scrollbar">
      {all.map((cat) => {
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
            <LayoutGrid size={18} strokeWidth={isActive ? 2.5 : 2} />
            {cat.name}
          </button>
        )
      })}

      {categories.map((cat) => {
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
            <Tag size={18} strokeWidth={isActive ? 2.5 : 2} />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}
