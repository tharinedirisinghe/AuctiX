import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

export interface VerificationDocument {
  docId: string;
  docTitle: string;
  docType: string;
  docSize: number;
  createdAt: string;
  reviewedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  description: string;
  sellerUsername: string;
}

export function VerificationSubmissionList({
  documents,
  isLoading = false,
  selectedDocumentId,
  onDocumentSelect,
}: {
  documents: VerificationDocument[];
  isLoading?: boolean;
  selectedDocumentId?: string;
  onDocumentSelect?: (document: VerificationDocument) => void;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="border-l-2 border-yellow-500 bg-gray-50 h-[90vh] mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Verification Submissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
        {isLoading ? (
          <>
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-[180px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          </>
        ) : documents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No verification submissions
          </p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.docId}
              className={`border rounded-lg p-4 cursor-pointer transition-all hover:bg-white ${
                selectedDocumentId === doc.docId
                  ? 'bg-white border-yellow-500 shadow-sm'
                  : 'hover:border-gray-300'
              }`}
              onClick={() => onDocumentSelect?.(doc)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0 mr-3">
                  <h3 className="font-medium truncate">{doc.docTitle}</h3>
                  <p className="text-sm text-gray-500">
                    Submitted On: {formatDate(doc.createdAt)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {formatFileSize(doc.docSize)} • {doc.docType}
                  </p>
                </div>
                <Badge
                  variant={
                    doc.status === 'PENDING'
                      ? 'default'
                      : doc.status === 'APPROVED'
                        ? 'success'
                        : 'destructive'
                  }
                  className="ml-2 whitespace-nowrap flex-shrink-0"
                >
                  {doc.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
