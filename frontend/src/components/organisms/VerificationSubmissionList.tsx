import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

export interface VerificationDocument {
  id: string;
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

  console.log('Rendering VerificationSubmissionList');

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
    <Card className="border-l-2 border-yellow-500 bg-gray-50 h-[calc(100vh-80px)]">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900">
          Verification Submissions
        </CardTitle>
        <CardDescription>
          {documents.length > 0
            ? `${documents.length} document${documents.length !== 1 ? 's' : ''} submitted for review`
            : 'No documents submitted'}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-140px)]">
        <div className="space-y-3 h-full overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 bg-white border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center bg-white border rounded-lg">
              <p className="text-gray-500">No verification submissions found</p>
              <p className="text-sm text-gray-400 mt-1">
                Documents will appear here once submitted
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 bg-white border rounded-lg cursor-pointer transition-all hover:shadow-sm border-l-4 ${
                  selectedDocumentId === doc.id
                    ? 'border-l-yellow-500 border-yellow-500 shadow-sm bg-yellow-50'
                    : 'border-l-yellow-500 hover:border-gray-300 hover:border-l-yellow-500'
                }`}
                onClick={() =>
                  onDocumentSelect ? onDocumentSelect(doc) : () => {}
                }
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0 mr-3">
                    <h4 className="font-medium text-gray-900 truncate mb-1">
                      {doc.docTitle}
                    </h4>
                    <p className="text-sm text-gray-600 mb-1">
                      Submitted: {formatDate(doc.createdAt)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(doc.docSize)} • {doc.docType}
                    </p>
                  </div>
                  <Badge
                    variant={
                      doc.status === 'PENDING'
                        ? 'secondary'
                        : doc.status === 'APPROVED'
                          ? 'default'
                          : 'destructive'
                    }
                    className="whitespace-nowrap flex-shrink-0 text-[8px] max-w-[60px] text-center"
                  >
                    {doc.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
