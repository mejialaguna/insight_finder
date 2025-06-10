import Link from 'next/link';

export default function AuthNavigation({
  pathName,
  label,
}: {
  pathName: string;
  label: string;
}) {
  return (
    <Link
      className="text-sm text-purple-600 hover:text-purple-800 transition-colors"
      href={pathName}
    >
      {label}
    </Link>
  );
}
