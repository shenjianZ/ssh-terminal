interface FeatureProps {
  icon?: string
  title: string
  description: string
}

export function Feature({ icon = '🚀', title, description }: FeatureProps) {
  return (
    <div className="my-4 rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-600">
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  )
}