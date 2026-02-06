import { TopNav } from "@/components/top-nav";

export default function DashboardLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            <TopNav />
            <main className="mx-auto w-full px-4 md:w-[90%] lg:w-[80%] max-w-[1600px] md:px-6">{children}</main>
        </div>
    );
}
