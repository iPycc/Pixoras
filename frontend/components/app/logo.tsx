export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" role="img" aria-label="Pixoras">
      <span className="block size-8 shrink-0 overflow-hidden rounded-lg">
        <svg
          aria-hidden="true"
          className="size-full"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="64" height="64" rx="16" fill="#9F2F4F" />
          <rect
            x="1"
            y="1"
            width="62"
            height="62"
            rx="15"
            fill="none"
            stroke="#7B1F3C"
            strokeOpacity=".34"
            strokeWidth="2"
          />
          <g fill="#FFF3E8">
            <circle cx="17" cy="12" r="5" />
            <circle cx="17" cy="22" r="5" />
            <circle cx="17" cy="32" r="5" />
            <circle cx="17" cy="42" r="5" />
            <circle cx="17" cy="52" r="5" />
          </g>
          <g fill="#FFBE55">
            <circle cx="27" cy="12" r="5" />
            <circle cx="37" cy="12" r="5" />
          </g>
          <g fill="#FF8A66">
            <circle cx="43" cy="22" r="5" />
            <circle cx="37" cy="32" r="5" />
            <circle cx="27" cy="32" r="5" />
          </g>
          <g fill="#9F2F4F">
            <circle cx="17" cy="12" r="1.45" />
            <circle cx="27" cy="12" r="1.45" />
            <circle cx="37" cy="12" r="1.45" />
            <circle cx="17" cy="22" r="1.45" />
            <circle cx="43" cy="22" r="1.45" />
            <circle cx="17" cy="32" r="1.45" />
            <circle cx="27" cy="32" r="1.45" />
            <circle cx="37" cy="32" r="1.45" />
            <circle cx="17" cy="42" r="1.45" />
            <circle cx="17" cy="52" r="1.45" />
          </g>
          <g fill="#FFFFFF" fillOpacity=".5">
            <circle cx="15.5" cy="10.5" r=".9" />
            <circle cx="25.5" cy="10.5" r=".9" />
            <circle cx="35.5" cy="10.5" r=".9" />
            <circle cx="15.5" cy="20.5" r=".9" />
            <circle cx="41.5" cy="20.5" r=".9" />
            <circle cx="15.5" cy="30.5" r=".9" />
            <circle cx="25.5" cy="30.5" r=".9" />
            <circle cx="35.5" cy="30.5" r=".9" />
            <circle cx="15.5" cy="40.5" r=".9" />
            <circle cx="15.5" cy="50.5" r=".9" />
          </g>
        </svg>
      </span>
      {!compact && (
        <span className="font-heading text-base font-bold tracking-[-0.03em]">
          Pixoras
        </span>
      )}
    </div>
  )
}
