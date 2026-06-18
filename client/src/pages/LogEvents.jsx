import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Calendar, Tag, FolderOpen, FileText, Activity, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function LogEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [groups, setGroups] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState([]);
  const [customFieldValues, setCustomFieldValues] = useState({});
  const [activeFields, setActiveFields ] = useState([]);
  const [newFieldName, setNewFieldName] = useState("");
  const [patientId, setPatientId] = useState(null);


  const [formData, setFormData] = useState({
    event_title: "",
    symptom: "",
    categoryId: "",
    date: new Date().toISOString().split("T")[0],
    severity: 3,
    notes: "",
  });

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 text-teal-700 mb-4">
      <Icon size={18} />
      <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
    </div>
  );

  const addCustomField = () => {
    if (!newFieldName.trim()) return;
    
    // Create a pseudo-template object
    const customField = {
      id: Date.now(), // Unique temporary ID
      field_name: newFieldName.charAt(0).toUpperCase() + newFieldName.slice(1),
      field_type: "text", // Default to text for user-defined
      is_required: false,
      unit: ""
    };
  
  setActiveFields((prev) => [...prev, customField]);
  setNewFieldName(""); // Clear the input
};  

  // Function to add a field to the form
  const addField = (fieldTemplate) => {
    setActiveFields((prev) => [...prev, fieldTemplate]);
  };

  // Function to remove a field
  const removeField = (fieldId) => {
    const fieldToRemove = activeFields.find(f => f.id === fieldId);
    
    // 1. Remove from active list
    setActiveFields((prev) => prev.filter((f) => f.id !== fieldId));
    
    // 2. Remove the value from the customFieldValues state
    if (fieldToRemove) {
      setCustomFieldValues(prev => {
        const newState = { ...prev };
        delete newState[fieldToRemove.field_name];
        return newState;
      });
    }
  };

  //handle the dynamic change of the slider
  const getSeverityLabel = (value) => {
    if (value <= 1) return "Minimal";
    if (value <= 2) return "Mild";
    if (value <= 3) return "Mild-moderate";
    if (value <= 5) return "Moderate";
    if (value <= 6) return "Moderate-severe";
    if (value <= 7) return "Severe";
    if (value <= 8) return "Very Severe";
    if (value <= 9) return "Moderate";
    return "Worst imaginable";
  };

  // When a dynamic input changes, update this state
  const handleCustomChange = (fieldName, value) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Filter categories based on selected group
  // NOTE: If your column name is not 'group_id', update it here:
  const filteredCategories = allCategories.filter(
    (c) => c.category_group_id === selectedGroupId
  );

  useEffect(() => {
    const init = async () => {
      const id = await resolvePatientId();
      setPatientId(id);
    };
    init();
  }, [user]);

  // Add this useEffect to fetch fields when categoryId changes
 useEffect(() => {
  // 1. Clear state whenever the category changes
  setActiveFields([]);
  setCustomFieldValues({});
  setFields([]); // Reset templates

  // 2. If no category is selected, stop here
  if (!formData.categoryId) {
    return;
  }

  // 3. Otherwise, fetch the new templates
  const fetchFields = async () => {
    const { data } = await supabase
      .from("category_field_templates")
      .select("*")
      .eq("category_id", formData.categoryId)
      .order("display_order");

    setFields(data || []);
  };
  
  fetchFields();
}, [formData.categoryId]);

  useEffect(() => {
    const fetchData = async () => {
      console.log("Fetching data...");

      // 1. Fetch Groups
      const { data: groupData, error: groupError } = await supabase
        .from("category_group")
        .select("id, name");

      if (groupError) {
        console.error("Error fetching groups:", groupError.message);
      } else {
        console.log("Groups loaded:", groupData);
        setGroups(groupData || []);
      }

      // 2. Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from("category")
        .select("id, category_name, category_group_id");

      if (catError) {
        console.error("Error fetching categories:", catError.message);
      } else {
        console.log("Categories loaded:", catData);
        setAllCategories(catData || []);
      }
    };

    fetchData();
  }, []);



  const update = (field) => (e) =>
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  async function resolvePatientId() {
    if (user?.patientId) return user.patientId;
    if (!user?.dbId) return null;
    const { data } = await supabase
      .from("patient_profiles")
      .select("id")
      .eq("user_id", user.dbId)
      .maybeSingle();
    if (data) return data.id;
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // 1. Create the main health event
      const { data: event, error: eventError } = await supabase
        .from("health_event")
        .insert({
          patient_id: patientId,
          category_id: Number(formData.categoryId),
          event_title: formData.event_title,
          severity: Number(formData.severity),
          date: formData.date,
          notes: formData.notes
        })
        .select("id") // CRITICAL: Get the ID of the new event
        .single();

      if (eventError) throw eventError;

      // 2. Prepare the dynamic fields for insertion
      const fieldsToInsert = Object.entries(customFieldValues).map(([key, value]) => ({
        event_id: event.id, // Linked to the event we just created
        field_name: key,
        field_value: value.toString() // Ensure value is a string or compatible type
      }));

      // 3. Insert all dynamic fields in one go
      const { error: fieldsError } = await supabase
        .from("health_event_fields")
        .insert(fieldsToInsert);

      if (fieldsError) throw fieldsError;

      toast.success("Health event and details logged!");
      navigate("/health-events");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 mb-6 hover:text-gray-800">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white p-8 rounded-2xl border shadow-sm">
        <h1 className="text-2xl font-bold mb-8">Log Health Event</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1 & 2. Title and Date (Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <SectionHeader icon={Tag} title="Event Title" />
              <Input required placeholder="e.g. Migraine" value={formData.event_title} onChange={update("event_title")} />
            </section>

            <section>
              <SectionHeader icon={Calendar} title="Date" />
              <Input type="date" required value={formData.date} onChange={update("date")} />
            </section>
          </div>

          {/* 3. Category Groups */}
          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <SectionHeader icon={FolderOpen} title="Select Group" />
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => { setSelectedGroupId(group.id); setFormData((prev) => ({ ...prev, categoryId: "" })); }}
                  className={`px-4 py-2 rounded-xl border text-sm transition-all ${selectedGroupId === group.id
                    ? "bg-teal-600 text-white border-teal-600 shadow-md"
                    : "bg-white hover:border-teal-200 border-gray-200"
                  }`}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </section>

          {/* 4. Symptom Type */}
          <section>
            <SectionHeader icon={FileText} title="Symptom Type" />
            {selectedGroupId ? (
              <div className="flex flex-wrap gap-2">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, categoryId: cat.id, symptom: cat.category_name }))}
                    className={`px-4 py-2 rounded-xl border text-sm transition-all ${formData.categoryId === cat.id
                      ? "bg-teal-600 text-white border-teal-600 shadow-md"
                      : "bg-white hover:border-teal-200 border-gray-200"
                    }`}
                  >
                    {cat.category_name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Select a group above to see symptoms...</p>
            )}
          </section>

          {/* 5. Details Section */}
          <section>
            <SectionHeader icon={FileText} title="Symptom Details" />
            
            {/* Symptom Name Input */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Symptom Name</label>
              <Input 
                required 
                placeholder="e.g. Migraine" 
                value={formData.symptom} 
                onChange={update("symptom")} 
              />
            </div>

            {/* Severity Slider */}
            <div className="p-6 border border-teal-100 rounded-2xl bg-teal-50/30">
              <div className="flex justify-between items-end mb-4">
                <label className="text-sm font-bold text-teal-700 uppercase tracking-wider">Severity Level</label>
                <span className="text-sm font-bold text-teal-600 px-3 py-1 bg-white rounded-full border border-teal-100 shadow-sm">
                  {getSeverityLabel(formData.severity)} ({formData.severity}/10)
                </span>
              </div>
              <input 
                required 
                type="range" min="1" max="10" 
                className="w-full h-2 bg-teal-100 rounded-lg cursor-pointer accent-teal-600"
                value={formData.severity} 
                onChange={update("severity")}
              />
            </div>
          </section>

          {/* Dynamic Fields Section */}
          <section className="space-y-4">
            {activeFields.map((field) => (
              <div key={field.id} className="relative p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <button 
                  onClick={() => removeField(field.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">
                  {field.field_name} {field.is_required && "*"}
                </label>
                <Input 
                  type={field.field_type === "number" ? "number" : "text"}
                  value={customFieldValues[field.field_name] || ""}
                  onChange={(e) => handleCustomChange(field.field_name, e.target.value)} 
                />
              </div>
            ))}
          </section>

          {/* Manage Optional Fields */}
          <section className="space-y-4 pt-4 border-t border-gray-100">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <PlusCircle size={16} className="text-teal-600" /> Add Details
            </label>
            
            <div className="flex gap-2">
              {/* 1. Template Selector */}
              <select 
                value=""
                onChange={(e) => {
                  const field = fields.find(f => f.id === parseInt(e.target.value));
                  if (field) addField(field);
                }}
                className="flex-1 p-2 border border-gray-200 rounded-xl text-sm bg-white"
              >
                <option value="">+ From Template</option>
                {fields
                  .filter(f => !activeFields.some(active => active.id === f.id))
                  .filter(f => !["symptom name", "symptom", "severity"].includes(f.field_name.toLowerCase()))
                  .map(f => <option key={f.id} value={f.id}>{f.field_name}</option>)
                }
              </select>

              {/* 2. Custom Field */}
              <div className="flex w-1/2 gap-1">
                <Input 
                  className="text-sm"
                  placeholder="Custom..." 
                  value={newFieldName} 
                  onChange={(e) => setNewFieldName(e.target.value)} 
                />
                <Button type="button" onClick={addCustomField} variant="outline" className="px-3 rounded-xl">+</Button>
              </div>
            </div>
          </section>

        {/* Notes (Optional) */}
        <section>
          <SectionHeader icon={FileText} title="Notes" />
          <Textarea
            className="min-h-[100px] resize-y"
            placeholder="Any extra details about how you're feeling?"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </section>

          <Button type="submit" className="w-full bg-teal-600 h-12 rounded-xl text-lg font-bold" disabled={saving}>
            {saving ? "Saving..." : "Save Log"}
          </Button>
        </form>
      </div>
    </div>
  );
}