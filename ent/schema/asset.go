package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
)

type Asset struct {
	ent.Schema
}

func (Asset) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").
			StorageKey("id").
			Immutable(),
		field.String("original_filename").
			NotEmpty(),
		field.Enum("file_type").
			Values("image", "document", "audio", "video", "other"),
		field.String("extension"),
		field.Int64("file_size_bytes").
			Positive(),
		field.String("storage_path"),
		field.Time("created_at").
			Default(time.Now).
			Immutable(),
	}
}

func (Asset) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("created_at"),
		index.Fields("file_type"),
	}
}
