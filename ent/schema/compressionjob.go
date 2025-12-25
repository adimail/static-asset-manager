package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

type CompressionJob struct {
	ent.Schema
}

func (CompressionJob) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").DefaultFunc(uuid.NewString),
		field.String("status").Default("pending"), // pending, processing, completed, failed
		field.Int("progress").Default(0),
		field.String("error").Optional(),
		field.Time("started_at").Optional(),
		field.Time("completed_at").Optional(),
	}
}

func (CompressionJob) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("asset", Asset.Type).Ref("compression_jobs").Unique().Required(),
	}
}
