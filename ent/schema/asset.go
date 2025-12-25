package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type Asset struct {
	ent.Schema
}

func (Asset) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(uuid.NewString),
		field.String("original_filename"),
		field.String("file_type"),
		field.String("extension"),
		field.Int64("file_size_bytes"),
		field.String("storage_path"),
		field.Time("created_at").Default(time.Now),

		// Compression fields
		field.Bool("is_compressed").Default(false),
		field.String("original_path").Optional(),
		field.Float("compression_ratio").Optional(),
	}
}

func (Asset) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("tags", Tag.Type),
		edge.To("compression_jobs", CompressionJob.Type).Annotations(entsql.OnDelete(entsql.Cascade)),
	}
}
