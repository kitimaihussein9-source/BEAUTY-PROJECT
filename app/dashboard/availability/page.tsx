
"use client"

import type React from "react"
import { useState, useEffect, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// Helper to generate time options (e.g., "09:00", "09:30")
const generateTimeOptions = () => {
    const options = []
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
            options.push(time)
        }
    }
    return options
}
const timeOptions = generateTimeOptions()

const availabilityFormSchema = z.object({
    availability: z.array(z.object({
        day_of_week: z.number(),
        is_available: z.boolean(),
        start_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })).superRefine((items, ctx) => {
        items.forEach((item, index) => {
            if (item.is_available) {
                const startTime = parseInt(item.start_time.replace(":", ""), 10)
                const endTime = parseInt(item.end_time.replace(":", ""), 10)
                if (startTime >= endTime) {
                    ctx.addIssue({
                        path: [index, 'end_time'],
                        message: "End time must be after start time",
                        code: z.ZodIssueCode.custom
                    })
                }
            }
        })
    })
})

type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>

export default function AvailabilityPage() {
    const supabase = createClient()
    const { toast } = useToast()
    const [isPending, startTransition] = useTransition()
    const [userId, setUserId] = useState<string | null>(null)

    const form = useForm<AvailabilityFormValues>({
        resolver: zodResolver(availabilityFormSchema),
        defaultValues: {
            availability: daysOfWeek.map((_, index) => ({
                day_of_week: index,
                is_available: (index >= 1 && index <= 5), // Default Mon-Fri
                start_time: "09:00",
                end_time: "17:00",
            }))
        }
    })
    const { fields } = useFieldArray({ name: "availability", control: form.control })

    useEffect(() => {
        const fetchUserAndAvailability = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                const { data, error } = await supabase
                    .from('provider_availability')
                    .select('*')
                    .eq('provider_id', user.id)

                if (data) {
                    const newAvailability = daysOfWeek.map((_, index) => {
                        const dayData = data.find(d => d.day_of_week === index)
                        return dayData ? {
                            day_of_week: dayData.day_of_week,
                            is_available: dayData.is_available,
                            start_time: dayData.start_time.substring(0, 5),
                            end_time: dayData.end_time.substring(0, 5),
                        } : form.getValues(`availability.${index}`)
                    })
                    form.reset({ availability: newAvailability })
                }
            }
        }
        fetchUserAndAvailability()
    }, [supabase, form])

    const onSubmit = (data: AvailabilityFormValues) => {
        startTransition(async () => {
            if (!userId) return

            const recordsToUpsert = data.availability.map(day => ({
                provider_id: userId,
                day_of_week: day.day_of_week,
                start_time: `${day.start_time}:00`,
                end_time: `${day.end_time}:00`,
                is_available: day.is_available,
            }))
            
            const { error } = await supabase.from('provider_availability').upsert(recordsToUpsert, {
                onConflict: 'provider_id, day_of_week',
            })

            if (error) {
                toast({
                    title: "Error saving schedule",
                    description: error.message,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "Schedule Saved!",
                    description: "Your availability has been updated successfully.",
                })
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Set Your Availability</CardTitle>
                <CardDescription>Define your weekly working hours. This will determine the time slots customers can book.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-4">
                            {fields.map((field, index) => {
                                const isAvailable = form.watch(`availability.${index}.is_available`)
                                return (
                                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4 p-4 border rounded-lg">
                                        <FormField
                                            control={form.control}
                                            name={`availability.${index}.is_available`}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between md:col-span-1 rounded-lg p-3 shadow-sm">
                                                    <FormLabel className="font-semibold text-lg">{daysOfWeek[index]}</FormLabel>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className={`md:col-span-3 grid grid-cols-2 gap-4 transition-opacity ${isAvailable ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                            <FormField
                                                control={form.control}
                                                name={`availability.${index}.start_time`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Start Time</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value} disabled={!isAvailable}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {timeOptions.map(time => <SelectItem key={\`start-${time}\`} value={time}>{time}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`availability.${index}.end_time`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>End Time</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value} disabled={!isAvailable}>
                                                            <FormControl>
                                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {timeOptions.map(time => <SelectItem key={\`end-${time}\`} value={time}>{time}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Schedule
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
