"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Camera, Upload, X } from "lucide-react"

interface AvatarUploadProps {
  currentAvatar?: string
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
  size?: "sm" | "md" | "lg"
}

export function AvatarUpload({ currentAvatar, onUpload, isUploading = false, size = "md" }: AvatarUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  }

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB")
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    await onUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        className={`${sizeClasses[size]} relative rounded-full overflow-hidden border-2 border-dashed border-gray-300 ${
          dragOver ? "border-pink-500 bg-pink-50" : ""
        } ${isUploading ? "opacity-50" : ""}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {preview || currentAvatar ? (
          <img
            src={preview || currentAvatar || "/placeholder.svg"}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Camera className="h-6 w-6 text-gray-400" />
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <label htmlFor="avatar-upload">
          <Button type="button" variant="outline" size="sm" disabled={isUploading} asChild>
            <span className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </span>
          </Button>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />
        {(preview || currentAvatar) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setPreview(null)
              // Reset file input
              const input = document.getElementById("avatar-upload") as HTMLInputElement
              if (input) input.value = ""
            }}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Drag and drop or click to upload
        <br />
        Max size: 5MB
      </p>
    </div>
  )
}
