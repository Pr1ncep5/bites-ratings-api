import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/social')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/social"!</div>
}
