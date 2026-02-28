import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/restaurants/$restaurantId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/restaurants/$restaurantId"!</div>
}
