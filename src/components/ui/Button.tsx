import { cn } from '@/lib/utils'
import { cva, VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import * as React from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        // primary: inverted pill (white on black in dark, black on white in light)
        default: 'bg-primary text-primary-foreground hover:bg-primary/85',
        // red is a signal, so destructive actions are outlined, not filled
        destructive:
          'border border-signal/60 bg-transparent text-signal hover:bg-signal hover:text-destructive-foreground',
        outline: 'border border-input bg-transparent text-foreground hover:border-display hover:text-display',
        subtle: 'bg-secondary text-secondary-foreground hover:bg-accent',
        ghost: 'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground data-[state=open]:bg-transparent',
        link: 'rounded-none bg-transparent text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-9 px-4',
        xs: 'h-8 px-3 text-xs',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant, isLoading, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading}
        {...props}>
        {isLoading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }