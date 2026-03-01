async function check() {
    const res = await fetch("https://lweywjgjdfobwbgfxmdv.supabase.co/rest/v1/devis_items", {
        method: 'POST',
        headers: {
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZXl3amdqZGZvYndiZ2Z4bWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTE3NTgsImV4cCI6MjA4NjU4Nzc1OH0.Pn7Q33p5SKFGuipjikJfsuVCLWkcIL5-7JCYAYPHc48",
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZXl3amdqZGZvYndiZ2Z4bWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTE3NTgsImV4cCI6MjA4NjU4Nzc1OH0.Pn7Q33p5SKFGuipjikJfsuVCLWkcIL5-7JCYAYPHc48",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        },
        body: JSON.stringify({
            designation: "test",
            quantity: 1,
            unit_price: 1,
            unit: "U",
            is_header: false
        })
    });
    const text = await res.text();
    console.log(text);
}
check();
