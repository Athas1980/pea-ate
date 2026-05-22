import helpHtml from '../help.md'

export default function HelpView() {
  return (
    <div
      className="help-content max-w-2xl mx-auto py-8 px-4"
      dangerouslySetInnerHTML={{ __html: helpHtml }}
    />
  )
}
