import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  title,
  value
}: {
  title: string;
  value: number | bigint;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">
          {typeof value === "bigint" ? value.toString() : value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}
