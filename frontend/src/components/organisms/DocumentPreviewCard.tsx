import { Check, Download, MessageSquare, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { VerificationDocument } from './VerificationSubmissionList';

export function DocumentPreviewCard({
  document,
}: {
  document: VerificationDocument | null;
}) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  };

  if (!document) {
    return (
      <Card className="border-l-2 border-yellow-500 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-lg">Document Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 bg-white">
            <div className="bg-gray-100 h-64 flex items-center justify-center">
              <p className="text-gray-500">No document selected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-2 border-yellow-500 bg-gray-50">
      <CardHeader>
        <CardTitle className="text-lg">
          Preview of: {document.docTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-lg p-4 bg-white">
          {/* Image preview placeholder */}
          <div className="bg-gray-100 h-64 flex items-center justify-center">
            <img
              src={`/api/documents/${document.docId}/preview`}
              alt={document.docTitle}
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'flex';
              }}
            />
            <div className="hidden items-center justify-center text-gray-500">
              Preview not available
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Type:</p>
            <p className="font-medium">{document.docType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Size:</p>
            <p className="font-medium">{formatFileSize(document.docSize)}</p>
          </div>
        </div>

        {document.description && document.description !== 'no review notes' && (
          <div>
            <p className="text-sm text-gray-600">Notes:</p>
            <p className="font-medium">{document.description}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button variant="destructive" className="gap-2">
            <X className="h-4 w-4" />
            Reject
          </Button>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Add Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
